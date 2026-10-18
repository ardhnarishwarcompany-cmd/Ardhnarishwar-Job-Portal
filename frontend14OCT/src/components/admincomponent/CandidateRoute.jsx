import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const CandidateRoute = ({ children }) => {
  const { user } = useSelector((store) => store.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== "Employee") {
      navigate("/");  
    }
  }, [user, navigate]);   
 
  if (!user || user.role !== "Employee") {
    return null;   
  }

  return <>{children}</>;   
};

export default CandidateRoute;
