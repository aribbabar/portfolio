import avatar from "../images/avatar.svg";
import "../css/About.css";

const About = () => {
  return (
    <div id="about">
      <div className="title-container">
        <h2>About</h2>
      </div>
      <img className="avatar" src={avatar} alt="" />
      <h2 className="title">Arib Farooqui</h2>
      <p className="about-me-text">
        Hi! I'm Arib. I'm currently studying computer science at the University
        of Maryland, and I hope to graduate with a bachelor's degree by 2024. I
        love coding, and in my free time, I like learning new technologies and
        working on personal projects such as this one! When I'm not coding, I'm
        either watching sci-fi shows/movies or playing video games.
      </p>
    </div>
  );
};

export default About;
