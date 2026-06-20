# 5. Thematic Pitmaster Naming Conventions

## Status

Accepted

## Context

The standard terminology for background task distribution in Python revolves around the "Celery" package, using names like "Celery workers" and "Celery Beat". Since this project is a specialized meat-cooking and smoking application, using vegetable-themed and generic computer-science names for core architecture components conflicts with the project's domain. We want to align the codebase and architecture docs with the "pitmaster" domain while still utilizing the standard `celery` library under the hood.

## Decision

We will adopt a strict thematic naming convention across our configuration, directories, Docker compose files, and documentation.
* The background worker service container (`celery_worker`) is renamed to **`pit_boss`**.
* The periodic task scheduler service container (`celery_beat`) is renamed to **`stoker`**.
* The core Celery application instance variable (`celery_app`) is renamed to **`smoker_controller`**.
* The background tasks script (`tasks.py`) is renamed to **`pit_tasks.py`**.

Under the hood, we will still import the standard `celery` Python library, but all user-defined code symbols and deployment configurations will follow this pitmaster-themed convention.

## Consequences

* **Pros**:
  * Enhances readability and developer enjoyment by aligning codebase concepts directly with the physical domain (meat smoking).
  * Clearer separation of roles: it is intuitive that the `stoker` triggers events and the `pit_boss` processes them.
* **Cons**:
  * Minor learning curve for external developers who expect generic Celery terms in the Docker Compose configurations.
