import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FileUploadForm from './components/FileUploadForm';
import ProtectedRoute from './components/ProtectedRoute';
import 'bootstrap/dist/css/bootstrap.min.css';

// Simple placeholder
const Dashboard = () => (
  <div style={{ padding: "2rem" }}>
    <h1>Admin Dashboard</h1>
    <p>Welcome, Admin!</p>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/upload"
          element={
            <ProtectedRoute allowedRole="driver">
              <FileUploadForm />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
