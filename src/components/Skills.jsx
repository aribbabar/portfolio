import "../css/Skills.css";

const Skills = () => {
  return (
    <section id="skills-section">
      <div className="title-container">
        <h2>Skills</h2>
      </div>
      <div className="skills-container">
        <div className="skill-container">
          <h2>Front-End</h2>
          <div className="line"></div>
          <div className="skills">
            <div className="skill-background">
              <p>HTML</p>
            </div>
            <div className="skill-background">
              <p>CSS</p>
            </div>
            <div className="skill-background">
              <p>JS</p>
            </div>
            <div className="skill-background">
              <p>React</p>
            </div>
            <div className="skill-background grid-span-2">
              <p>Svelte</p>
            </div>
          </div>
        </div>
        <div className="skill-container">
          <h2>Back-End</h2>
          <div className="line"></div>
          <div className="skills">
            <div className="skill-background">
              <p>Node</p>
            </div>
            <div className="skill-background">
              <p>Java</p>
            </div>
            <div className="skill-background grid-span-2">
              <p>C#</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;
