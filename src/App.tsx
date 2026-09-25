import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import SubmitReport from './pages/student/SubmitReport';
import SuccessPage from './pages/student/SuccessPage';
import TrackStatus from './pages/student/TrackStatus';
import Dashboard from './pages/bk/Dashboard';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';

function App() {
  return (
    <Router>
      <div className="main-content">
        <Navbar />
        <main className="container mt-6">
          <Routes>
            {/* Student Routes */}
            <Route path="/" element={<SubmitReport />} />
            <Route path="/success/:reportNumber" element={<SuccessPage />} />
            <Route path="/track" element={<TrackStatus />} />

            {/* Unified Login */}
            <Route path="/login" element={<Login />} />

            {/* BK Routes */}
            <Route path="/bk/dashboard" element={<Dashboard />} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
