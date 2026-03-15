from rest_framework import serializers
from .models import Annotation


class AnnotationSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Annotation
        fields = [
            "id",
            "post",
            "user",
            "username",
            "text",
            "image",
            "status",
            "created_at",
            "updated_at",
            "validated_by",
            "validated_at",
        ]
        read_only_fields = [
            "user",
            "status",
            "created_at",
            "updated_at",
            "validated_by",
            "validated_at",
        ]

    def validate(self, attrs):
        text = attrs.get("text")
        image = attrs.get("image")

        if not text and not image:
            raise serializers.ValidationError("Annotation must contain text or image.")

        return attrs