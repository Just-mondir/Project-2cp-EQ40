from __future__ import annotations

from django.test import SimpleTestCase

from apps.core.responses import api_error, api_success


class CoreResponseTests(SimpleTestCase):
    def test_api_success_shape(self):
        response = api_success("ok", {"value": 1}, status_code=201)
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["message"], "ok")
        self.assertEqual(response.data["data"]["value"], 1)

    def test_api_error_shape(self):
        response = api_error("bad", {"field": "error"}, status_code=400)
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data["success"])
        self.assertEqual(response.data["message"], "bad")
        self.assertEqual(response.data["errors"]["field"], "error")
