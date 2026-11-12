from __future__ import annotations

from fastapi.testclient import TestClient


class TestSessionsEndpoint:
    def test_create_session(self, client: TestClient) -> None:
        response = client.post("/api/v1/sessions", json={"title": "Test Session"})
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["title"] == "Test Session"
        assert "created_at" in data

    def test_list_sessions(self, client: TestClient) -> None:
        client.post("/api/v1/sessions", json={"title": "List Test 1"})
        client.post("/api/v1/sessions", json={"title": "List Test 2"})

        response = client.get("/api/v1/sessions")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2

    def test_get_session_with_messages(self, client: TestClient) -> None:
        create_res = client.post("/api/v1/sessions", json={"title": "Detailed Session"})
        session_id = create_res.json()["id"]

        get_res = client.get(f"/api/v1/sessions/{session_id}")
        assert get_res.status_code == 200
        session_data = get_res.json()
        assert session_data["id"] == session_id
        assert session_data["title"] == "Detailed Session"
        assert "messages" in session_data
        assert isinstance(session_data["messages"], list)

    def test_get_nonexistent_session_returns_404(self, client: TestClient) -> None:
        response = client.get("/api/v1/sessions/nonexistent-id-0000")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
