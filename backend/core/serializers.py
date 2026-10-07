from rest_framework import serializers

from .models import (
    Ticket,
    ServiceRequest,
    ContactMessage,
    Reply,
)


class BaseSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username",
        read_only=True
    )

    replies = serializers.SerializerMethodField()

    reply_kind = None

    def get_replies(self, obj):
        qs = (
            Reply.objects
            .filter(
                kind=self.reply_kind,
                obj_id=obj.id
            )
            .select_related("user")
        )

        return [
            {
                "id": reply.id,
                "message": reply.message,
                "username": reply.user.username,
                "is_staff": reply.user.is_staff,
            }
            for reply in qs
        ]


class TicketSerializer(BaseSerializer):

    reply_kind = "tickets"

    class Meta:
        model = Ticket
        fields = "__all__"
        read_only_fields = [
            "user",
            "status",
            "created",
        ]


class ServiceRequestSerializer(BaseSerializer):

    reply_kind = "requests"

    class Meta:
        model = ServiceRequest
        fields = "__all__"
        read_only_fields = [
            "user",
            "status",
            "created",
        ]


class ContactMessageSerializer(serializers.ModelSerializer):

    class Meta:
        model = ContactMessage
        fields = "__all__"
        read_only_fields = [
            "created",
        ]