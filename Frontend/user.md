# User Feature API Documentation (Frontend)

This document outlines all the API endpoints and frontend request structures related to **User Data** and **Authentication** CRUD operations.

All requests should be prefixed with your base API URL (e.g., `http://127.0.0.1:8000/api`).

---

## 1. Authentication (Create / Login)

### Register a New User
- **Method:** `POST`
- **Endpoint:** `/auth/register/`
- **Payload (`application/json`):**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123",
    "username": "optional-slug",
    "display_name": "Optional Name"
  }
  ```
- **Response:** Returns `{ "data": { "user_id": "..." } }`. You take this `user_id` to verify the OTP.

### Verify Email (OTP)
- **Method:** `POST`
- **Endpoint:** `/auth/verify-email/`
- **Payload (`application/json`):**
  ```json
  {
    "user_id": "the-user-id-from-registration",
    "otp_code": "123456"
  }
  ```
- **Response:** Returns `access` token, `refresh` token, and the `user` object. Save tokens in `localStorage`.

### Login
- **Method:** `POST`
- **Endpoint:** `/auth/login/`
- **Payload (`application/json`):**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123"
  }
  ```
- **Response:** Returns `access` token, `refresh` token, and the `user` object. Save tokens in `localStorage`.

---

## 2. User Profile (Read / Update / Delete)

Authentication is **required** for the following endpoints. You must include the token in the headers:
```javascript
headers: {
  "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
}
```

### Get Current User Profile (Read)
- **Method:** `GET`
- **Endpoint:** `/users/me/`
- **Description:** Retrieves the customized information for the currently authenticated user.

### Update Profile Information (Update)
- **Method:** `PATCH`
- **Endpoint:** `/users/me/`
- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>`
- **Payload (`application/json`):**
  You only need to send the fields you wish to update.
  ```json
  {
    "username": "john-doe",
    "display_name": "John Doe",
    "bio": "Historian and archaeologist.",
    "expertise": "historian",
    "speciality": "Roman Period"
  }
  ```
  *(Note: `expertise` must be one of the exact backend choices like `amateur`, `student`, `researcher`, `architect`, `historian`, `guide`.)*

### Upload Profile Picture (Update Media)
- **Method:** `POST`
- **Endpoint:** `/users/me/profile-picture/`
- **Headers:** `Authorization: Bearer <token>` *(Do **NOT** set `Content-Type`; the browser sets it automatically with the boundary for FormData).*
- **Payload (`multipart/form-data`):**
  ```javascript
  const formData = new FormData();
  formData.append("profile_picture", fileInput.files[0]); // The raw File object
  ```
- **Example Usage:**
  ```javascript
  const picResponse = await fetch(`${API_BASE_URL}/users/me/profile-picture/`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: formData
  });
  ```
- **Response:** Returns the new generated image URL.

### Deactivate/Delete Account (Delete)
- **Method:** `DELETE`
- **Endpoint:** `/users/me/`
- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>`
- **Payload (`application/json`):**
  ```json
  {
    "refresh": "the-refresh-token-to-blacklist"
  }
  ```
- **Description:** Soft-deletes the user's account and blacklists their token.

---

## 3. Public User Profiles (Read)

### Get Public User Profile
- **Method:** `GET`
- **Endpoint:** `/users/<username>/`
- **Description:** Retrieves the public details of any user by their `username` slug (used primarily in URLs like `/user/john-doe`). Authentication is **not required**.
