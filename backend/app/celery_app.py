from celery import Celery, Task


def celery_init_app(flask_app):

    class FlaskTask(Task):

        def __call__(self, *args, **kwargs):

            with flask_app.app_context():
                return self.run(*args, **kwargs)

    celery = Celery(
        flask_app.import_name
    )

    celery.config_from_object(
        flask_app.config["CELERY"]
    )

    celery.Task = FlaskTask

    celery.set_default()

    flask_app.extensions["celery"] = celery

    celery.autodiscover_tasks(
        ["app.tasks"]
    )

    import app.tasks.email_task
    import app.tasks.complaint_task

    return celery