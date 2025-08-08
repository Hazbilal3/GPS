import React from "react";

const Dashboard: React.FC = () => {
  return (
    <div className="page">
      <div className="page-inner">
        <div className="card-surface p-4 p-md-5 mb-4">
          <h1 className="mb-1">Admin Dashboard</h1>
          <p className="mb-0" style={{opacity:.85}}>
            Welcome, Admin. Your quick overview will appear here.
          </p>
        </div>

        <div className="row g-3">
          <div className="col-md-4">
            <div className="card-surface p-4">
              <h5 className="mb-2">Stat One</h5>
              <div className="display-6 fw-bold">42</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card-surface p-4">
              <h5 className="mb-2">Stat Two</h5>
              <div className="display-6 fw-bold">128</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card-surface p-4">
              <h5 className="mb-2">Stat Three</h5>
              <div className="display-6 fw-bold">7</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
