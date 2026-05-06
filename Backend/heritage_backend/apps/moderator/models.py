from mongoengine import Document, StringField, DateTimeField, IntField

class Visitor(Document):
    ip_address = StringField(required=True)
    date = DateTimeField(required=True)
    meta = {
        "indexes": [
            {"fields": ["ip_address", "date"], "unique": True}
        ]
    }


class PlatformSnapshot(Document):
    date = DateTimeField(required=True)
    members = IntField(default=0)
    groups = IntField(default=0)
    visitors = IntField(default=0)
    posts = IntField(default=0)

    meta = {
        "collection": "platform_snapshots",
        "ordering": ["date"],
        "indexes": [
            {"fields": ["date"], "unique": True}
        ],
    }