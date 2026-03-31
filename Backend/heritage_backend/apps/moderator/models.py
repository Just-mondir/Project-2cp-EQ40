from mongoengine import Document, StringField, DateTimeField

class Visitor(Document):
    ip_address = StringField(required=True)
    date = DateTimeField(required=True)
    meta = {
        "indexes": [
            {"fields": ["ip_address", "date"], "unique": True}
        ]
    }