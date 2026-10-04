import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import settings

TEST_DB_FILE = "test_push.db"
settings.DB_URL = f"sqlite:///{TEST_DB_FILE}"

from app import push  # noqa: E402
from app.database import get_db_connection, init_db  # noqa: E402
from app.main import app  # noqa: E402

client = TestClient(app)

SUB = {
    "endpoint": "https://fcm.googleapis.com/fcm/send/abc123",
    "keys": {"p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM", "auth": "tBHItJI5svbpez7KI4CCXg"},
}


@pytest.fixture(scope="module", autouse=True)
def db_file():
    path = Path(TEST_DB_FILE)
    if path.exists():
        path.unlink()
    init_db()
    yield
    if path.exists():
        path.unlink()


@pytest.fixture(autouse=True)
def clean(monkeypatch):
    conn = get_db_connection()
    try:
        conn.execute("DELETE FROM push_subscriptions")
        conn.execute("DELETE FROM push_alerts")
        conn.commit()
    finally:
        conn.close()
    monkeypatch.setattr(settings, "VAPID_PUBLIC_KEY", "BPublicKeyForTests")
    monkeypatch.setattr(settings, "VAPID_PRIVATE_KEY", "private-key-for-tests")
    monkeypatch.setattr(settings, "VAPID_SUBJECT", "mailto:pitmaster@example.com")


@pytest.fixture
def sent(monkeypatch):
    calls = []

    def fake_webpush(subscription_info, data, **kwargs):
        calls.append({"subscription": subscription_info, "data": json.loads(data), **kwargs})

    monkeypatch.setattr(push, "webpush", fake_webpush)
    return calls


def test_public_key_is_served_when_configured():
    response = client.get("/api/push/public-key")
    assert response.status_code == 200
    assert response.json() == {"publicKey": "BPublicKeyForTests"}


def test_public_key_reports_unconfigured_push(monkeypatch):
    monkeypatch.setattr(settings, "VAPID_PUBLIC_KEY", None)
    assert client.get("/api/push/public-key").status_code == 503


def test_subscribe_validates_and_is_idempotent():
    assert client.post("/api/push/subscribe", json=SUB).status_code == 201
    assert client.post("/api/push/subscribe", json=SUB).status_code == 201
    assert len(push.list_subscriptions()) == 1
    bad = {**SUB, "endpoint": "http://insecure.example/push"}
    assert client.post("/api/push/subscribe", json=bad).status_code == 422
    assert client.post("/api/push/subscribe", json={"endpoint": SUB["endpoint"]}).status_code == 422


def test_unsubscribe_removes_the_device():
    client.post("/api/push/subscribe", json=SUB)
    assert client.post("/api/push/unsubscribe", json={"endpoint": SUB["endpoint"]}).status_code == 200
    assert push.list_subscriptions() == []


def test_test_alert_goes_only_to_the_requesting_device(sent):
    client.post("/api/push/subscribe", json=SUB)
    client.post("/api/push/subscribe", json={**SUB, "endpoint": "https://fcm.googleapis.com/fcm/send/other"})
    response = client.post("/api/push/test", json={"endpoint": SUB["endpoint"]})
    assert response.status_code == 200
    assert [c["subscription"]["endpoint"] for c in sent] == [SUB["endpoint"]]
    assert sent[0]["vapid_private_key"] == "private-key-for-tests"
    assert sent[0]["vapid_claims"] == {"sub": "mailto:pitmaster@example.com"}
    assert client.post("/api/push/test", json={"endpoint": "https://unknown.example/x"}).status_code == 404


def test_pull_alert_is_sent_once_per_cook_and_only_while_cooking(sent):
    push.save_subscription(SUB["endpoint"], SUB["keys"]["p256dh"], SUB["keys"]["auth"])

    # Below the pull temperature (95 - 4 = 91): nothing.
    assert push.maybe_send_pull_alert("s1", "Brisket flat", core_c=90.0, target_c=95.0, carryover_c=4.0, status="bare") is False
    # At the pull temperature: one alert with the pull details.
    assert push.maybe_send_pull_alert("s1", "Brisket flat", core_c=91.2, target_c=95.0, carryover_c=4.0, status="bare") is True
    assert sent[0]["data"]["title"] == "Pull now"
    assert "Brisket flat" in sent[0]["data"]["body"]
    assert sent[0]["data"]["tag"] == "pull-s1"
    # Later readings for the same cook don't repeat it.
    assert push.maybe_send_pull_alert("s1", "Brisket flat", core_c=92.0, target_c=95.0, carryover_c=4.0, status="bare") is False
    # Once pulled (resting), no alert.
    assert push.maybe_send_pull_alert("s2", "Pork butt", core_c=95.0, target_c=95.0, carryover_c=None, status="resting") is False
    assert len(sent) == 1


def test_pull_alert_uses_the_target_when_carryover_is_unknown(sent):
    push.save_subscription(SUB["endpoint"], SUB["keys"]["p256dh"], SUB["keys"]["auth"])
    assert push.maybe_send_pull_alert("s3", "Ribeye", core_c=94.0, target_c=95.0, carryover_c=None, status="bare") is False
    assert push.maybe_send_pull_alert("s3", "Ribeye", core_c=95.0, target_c=95.0, carryover_c=None, status="bare") is True


def test_expired_subscriptions_are_removed(monkeypatch):
    push.save_subscription(SUB["endpoint"], SUB["keys"]["p256dh"], SUB["keys"]["auth"])

    class Gone:
        status_code = 410

    def failing_webpush(subscription_info, data, **kwargs):
        raise push.WebPushException("gone", response=Gone())

    monkeypatch.setattr(push, "webpush", failing_webpush)
    assert push.send_to_all({"title": "t", "body": "b"}) == 0
    assert push.list_subscriptions() == []


def test_nothing_is_sent_when_push_is_not_configured(monkeypatch, sent):
    monkeypatch.setattr(settings, "VAPID_PRIVATE_KEY", None)
    push.save_subscription(SUB["endpoint"], SUB["keys"]["p256dh"], SUB["keys"]["auth"])
    assert push.maybe_send_pull_alert("s4", "Brisket", core_c=95.0, target_c=95.0, carryover_c=0.0, status="bare") is False
    assert sent == []


def test_pull_alert_is_retried_until_a_device_receives_it(sent):
    # No device subscribed yet: nothing is delivered, so nothing is recorded as sent.
    assert push.maybe_send_pull_alert("s5", "Brisket", core_c=95.0, target_c=95.0, carryover_c=0.0, status="bare") is False
    push.save_subscription(SUB["endpoint"], SUB["keys"]["p256dh"], SUB["keys"]["auth"])
    # The next reading delivers it, and only then is it marked sent.
    assert push.maybe_send_pull_alert("s5", "Brisket", core_c=95.1, target_c=95.0, carryover_c=0.0, status="bare") is True
    assert push.maybe_send_pull_alert("s5", "Brisket", core_c=95.2, target_c=95.0, carryover_c=0.0, status="bare") is False
    assert len(sent) == 1


def test_connection_errors_are_contained_and_other_devices_still_get_the_alert(monkeypatch):
    push.save_subscription("https://push.example/down", "k", "a")
    push.save_subscription(SUB["endpoint"], SUB["keys"]["p256dh"], SUB["keys"]["auth"])
    delivered = []

    def flaky_webpush(subscription_info, data, **kwargs):
        if subscription_info["endpoint"] == "https://push.example/down":
            raise ConnectionError("push service unreachable")
        delivered.append(subscription_info["endpoint"])

    monkeypatch.setattr(push, "webpush", flaky_webpush)
    assert push.send_to_all({"title": "t", "body": "b"}) == 1
    assert delivered == [SUB["endpoint"]]
    # A transient failure doesn't remove the subscription.
    assert len(push.list_subscriptions()) == 2


def test_failed_delivery_does_not_mark_the_pull_alert_sent(monkeypatch):
    push.save_subscription(SUB["endpoint"], SUB["keys"]["p256dh"], SUB["keys"]["auth"])

    def down(subscription_info, data, **kwargs):
        raise ConnectionError("down")

    monkeypatch.setattr(push, "webpush", down)
    assert push.maybe_send_pull_alert("s6", "Brisket", core_c=95.0, target_c=95.0, carryover_c=0.0, status="bare") is False
    calls = []
    monkeypatch.setattr(push, "webpush", lambda subscription_info, data, **kw: calls.append(1))
    assert push.maybe_send_pull_alert("s6", "Brisket", core_c=95.0, target_c=95.0, carryover_c=0.0, status="bare") is True
    assert calls == [1]


def test_test_alert_reports_an_unreachable_push_service_as_502(monkeypatch):
    client.post("/api/push/subscribe", json=SUB)

    def down(subscription_info, data, **kwargs):
        raise ConnectionError("down")

    monkeypatch.setattr(push, "webpush", down)
    assert client.post("/api/push/test", json={"endpoint": SUB["endpoint"]}).status_code == 502
