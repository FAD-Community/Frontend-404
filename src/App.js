import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAccounts from './components/Useaccounts';
import AppLayout from './components/Applayout';
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Accounts from "./components/Accounts";
import Admins from "./components/Admins";
import { AccountsProvider } from './components/Useaccounts';
import Classes from "./components/Classes";
import Students from "./components/Students";
import ParentLinks from "./components/Parentlinks";
import NoAccess from "./components/Noaccess";
import './App.css';

function App() {
  return (
    <AccountsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* كل الصفحات اللي جوه الـ Route ده بتاخد الـ Sidebar أوتوماتيك */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/admins" element={<Admins />} />
              <Route path="/classes" element={<Classes />} /> 
              <Route path="/students" element={<Students />} />
              <Route path="/parentlinks" element={<ParentLinks />} />
              <Route path="/noaccess" element={<NoAccess/>} />


          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AccountsProvider>
  );
}

export default App;