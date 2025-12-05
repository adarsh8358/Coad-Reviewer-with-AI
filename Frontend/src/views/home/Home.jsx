import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);

  function navigateToProject(projectId) {
    navigate(`/project/${projectId}`);
  }

  useEffect(() => {
    axios.get('http://localhost:3000/projects/get-all')
      .then(response => {
        setProjects(response.data.data);
      })
      .catch(() => {
        setProjects([]);
      });
  }, []);

  return (
    <main className='home'>
      <section className='home-section'>
        <div className='header'>
          <h1>Projects</h1>
          <button
            className="new-project-btn"
            onClick={() => navigate('create-project')}
          >
            + New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className='empty'>
            <p>No Projects Created</p>
          </div>
        ) : (
          <div className="projects">
            {projects.map((project) => (
              <div
                key={project._id}
                className="project-card"
                onClick={() => navigateToProject(project._id)}
              >
                <div className="project-content">
                  <h3>{project.name}</h3>
                  <p>{project.description || "No description available"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Home;
