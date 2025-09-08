# Voice Recorder App Assignment

A modern, user-friendly voice recording application built with a serverless backend deployed on AWS Lambda and a React-based frontend interface. This app allows users to record, store, merge, list, and delete audio files seamlessly.

---

## **Features**

### **Backend:**
- **Add Audio**: Upload audio recordings to temporary bucket of AWS S3 as chunks.
- **List Audio**: Retrieve a list of previously uploaded audio files stored in S3.
- **Merge Audio**: Merge multiple audio files into one using AWS Lambda that are stored in temporary S3 bucket as chunks and return the merged file.
- **Remove Audio**: Delete an audio file from the AWS S3 bucket.

### **Frontend:**
- **Record Audio**: User-friendly interface to record audio with real-time validation for chunk duration (max 40 seconds).
- **List Recordings**: Display all available audio recordings.
- **Merge Recordings**: Merge two or more recordings chunks via the backend API.
- **Delete Recordings**: Remove selected recordings.

---

## **Technologies Used**

### **Backend:**
- **Node.js (v18+)**: Backend language.
- **AWS Services**:
  - **Lambda**: Core serverless functions.
  - **API Gateway**: Endpoint management.
  - **S3**: Storage for audio files.
  - **CloudWatch**: Logging and monitoring.

### **Frontend:**
- **React.js**: Interactive user interface.
- **CSS**: For styling.
- **HTML/JSX**: Base structure and interactivity.

### **CI/CD:**
- **GitHub Actions**: Automated deployment pipeline for backend updates on commits to the `qa` branch.

---

## **Getting Started**

### **Prerequisites**
1. Node.js and npm installed.
2. AWS account with appropriate permissions for:
   - Lambda
   - API Gateway
   - S3
   - CloudWatch
3. GitHub repository set up with security variables for AWS credentials.
4. Installed IDE (VS Code).

---

### **Setup Instructions**

#### **Clone the Repository**
```bash
git clone https://github.com/rajeev-git-space/ec-assignment-voice-recorder.git
cd ec-assignment-voice-recorder
```

#### **Frontend Setup Instructions**
1. cd frontend
2. npm install
3. npm start
