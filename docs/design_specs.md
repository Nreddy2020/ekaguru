# Ekaguru UI Design Specifications

**Core Philosophy**: Calm, Focused, Cognitive-Science Aligned.
**Anti-Patterns (Strictly Forbidden)**:
- ❌ Busy Interfaces
- ❌ "YouTube-like" distractions
- ❌ Generic Chatbot aestetics
- ❌ Gamification badges/scores (unless explicitly subtle)

## Page Contracts (Routes)

### 1. Parent Login & Consent
*   **Wireframe**: `01_parent_login.png`
*   **Route**: `/login` (or `/parent/login`)
*   **Key Elements**: Simple login, Consent acceptance.

### 2. Child Profile Setup
*   **Wireframe**: `02_child_profile.png`
*   **Route**: `/parent/child-setup`
*   **Key Elements**: Name, Age, Interests.

### 3. Upload Subjects / Books
*   **Wireframe**: `03_upload_content.png`
*   **Route**: `/subject/create` (Upload Mode)
*   **Key Elements**: PDF/Image, Upload drag-and-drop.

### 4. Ingestion Preview & Validation
*   **Wireframe**: `04_ingestion_preview.png`
*   **Route**: `/subject/ingest`
*   **Key Elements**: Parsing status, Verification.

### 5. Parent Learning Dashboard
*   **Wireframe**: `05_parent_dashboard.png`
*   **Route**: `/parent/dashboard`
*   **Key Elements**: High-level mastery, Fear index (Low/High).

### 6. Student Welcome Page
*   **Wireframe**: `06_student_welcome.png`
*   **Route**: `/student/welcome`
*   **Key Elements**: Calm greeting, "Ready to learn?".

### 7. Subject Selection
*   **Wireframe**: `07_subject_select.png`
*   **Route**: `/student/subjects`
*   **Key Elements**: Card grid, clean typography.

### 8. Topic Selection
*   **Wireframe**: `08_topic_select.png`
*   **Route**: `/student/subjects/[id]`
*   **Key Elements**: List/Tree view of topics.

### 9. Tutor Session (Core Learning)
*   **Wireframe**: `09_tutor_session.png`
*   **Route**: `/student/session/[id]`
*   **Key Elements**: The main reading/interaction pane. Split view?

### 10. Guided Struggle / Hints
*   **Wireframe**: `10_guided_struggle.png`
*   **Route**: `(Modal or Inline Component)`
*   **Key Elements**: Socratic hinting, not giving answers.

### 11. Reflection Page
*   **Wireframe**: `11_reflection.png`
*   **Route**: `/student/session/[id]/reflection`
*   **Key Elements**: "What did you learn?", Metacognition.

### 12. Session Summary
*   **Wireframe**: `12_session_summary.png`
*   **Route**: `/student/session/[id]/summary`
*   **Key Elements**: Mastery update, Next steps.

## Visual Reference (Received Wireframes)
*(Displaying first 5 available reference images)*

![Reference 1](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_0_1767958061133.png)
![Reference 2](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_1_1767958061133.png)
![Reference 3](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_2_1767958061133.png)
![Reference 4](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_3_1767958061133.png)
![Reference 5](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_4_1767958061133.png)

![Reference 6](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_0_1767958138512.png)
![Reference 7](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_1_1767958138512.png)
![Reference 8](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_2_1767958138512.png)
![Reference 9](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_3_1767958138512.png)
![Reference 10](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_4_1767958138512.png)

![Reference 11](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_0_1767958245661.png)
![Reference 12](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_1_1767958245661.png)
![Reference 13](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_2_1767958245661.png)
![Reference 14](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_3_1767958245661.png)
![Reference 15](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_4_1767958245661.png)

![Reference 16](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_0_1767958514496.png)
![Reference 17](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_1_1767958514496.png)
![Reference 18](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_2_1767958514496.png)
![Reference 19](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_3_1767958514496.png)
![Reference 20](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_4_1767958514496.png)

![Reference 21](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_0_1767958576964.png)
![Reference 22](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_1_1767958576964.png)
![Reference 23](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_2_1767958576964.png)
![Reference 24](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_3_1767958576964.png)
![Reference 25](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_4_1767958576964.png)

![Reference 26](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_0_1767958632412.png)
![Reference 27](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_1_1767958632412.png)
![Reference 28](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_2_1767958632412.png)
![Reference 29](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_3_1767958632412.png)
![Reference 30](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_4_1767958632412.png)

![Reference 31](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_0_1767958731352.png)
![Reference 32](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_1_1767958731352.png)
![Reference 33](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_2_1767958731352.png)
![Reference 34](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_3_1767958731352.png)
![Reference 35](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_4_1767958731352.png)

![Reference 36](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_0_1767958779829.png)
![Reference 37](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_1_1767958779829.png)
![Reference 38](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_2_1767958779829.png)
![Reference 39](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_3_1767958779829.png)
![Reference 40](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_4_1767958779829.png)

![Reference 41](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_0_1767958818602.png)
![Reference 42](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_1_1767958818602.png)
![Reference 43](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_2_1767958818602.png)
![Reference 44](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_3_1767958818602.png)
![Reference 45](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_4_1767958818602.png)

![Reference 46](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_0_1767958866069.png)
![Reference 47](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_1_1767958866069.jpg)
![Reference 48](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_2_1767958866069.png)
![Reference 49](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_3_1767958866069.png)
![Reference 50](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_4_1767958866069.png)

![Reference 51](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_0_1767958906556.png)
![Reference 52](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_1_1767958906556.png)
![Reference 53](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_2_1767958906556.png)
![Reference 54](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_3_1767958906556.png)
![Reference 55](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_4_1767958906556.png)

![Reference 56](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_0_1767958947175.png)
![Reference 57](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_1_1767958947175.png)
![Reference 58](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_2_1767958947175.png)
![Reference 59](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_3_1767958947175.png)
![Reference 60](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_4_1767958947175.png)

![Reference 61](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_0_1767958987651.png)
![Reference 62](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_1_1767958987651.png)
![Reference 63](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_2_1767958987651.png)
![Reference 64](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_3_1767958987651.png)
![Reference 65](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_4_1767958987651.png)

![Reference 66](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_0_1767959025669.png)
![Reference 67](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_1_1767959025669.png)
![Reference 68](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_2_1767959025669.png)
![Reference 69](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_3_1767959025669.png)
![Reference 70](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_4_1767959025669.png)

![Reference 71](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_0_1767959065845.png)
![Reference 72](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_1_1767959065845.png)
![Reference 73](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_2_1767959065845.png)
![Reference 74](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_3_1767959065845.png)
![Reference 75](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_4_1767959065845.png)

![Reference 76](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_0_1767959146271.png)
![Reference 77](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_1_1767959146271.png)
![Reference 78](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_2_1767959146271.png)
![Reference 79](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_3_1767959146271.png)
![Reference 80](file:///C:/Users/nirwa/.gemini/antigravity/brain/2eca97dd-61fb-49ba-b737-5123d953a995/uploaded_image_4_1767959146271.png)
