import "../css/WorkExperience.css";
import * as moment from "moment";

const WorkExperience = () => {
  // const timeSince = (date) => {
  //   let seconds = Math.floor((new Date() - date) / 1000);
  //   let interval = seconds / 31536000;
  //   let time = "";

  //   if (interval > 1) {
  //     time += Math.floor(interval) + " years";
  //   }

  //   interval = seconds / 2592000;

  //   if (interval > 1) {
  //     if (time === "") {
  //       time += (Math.floor(interval) % 10) + " months";
  //     } else {
  //       time += " & " + (Math.floor(interval) % 10) + " months";
  //     }
  //   }

  //   return time;
  // };

  const chalkysTime = moment([2022, 8, 1]).fromNow(true);
  const detsTime = moment([2021, 8, 1]).fromNow(true);

  return (
    <div id="work-experience">
      <div className="title-container">
        <h2>Work Experience</h2>
      </div>
      <div className="experience-container">
        <h2>Developer</h2>
        <h3>Chalky's</h3>
        <h5>Aug 2022 - Present ({chalkysTime})</h5>
        <ul>
          <li>
            We provide a variety of web services to other software developers
          </li>
          <li>
            We offer affordable and custom one-color t-shirt designs to local
            and online audiences
          </li>
        </ul>
        <div className="line-break"></div>
        <h2>Technical Director</h2>
        <h3>Distance Education Tech & Services (DETS)</h3>
        <h5>Aug 2021 - Present ({detsTime})</h5>
        <ul>
          <li>Provided technical support to instructors</li>
          <li>Recorded classroom with basic staging techniques</li>
        </ul>
        <div className="line-break"></div>
        <h2>Key Holder (Assistant Manager)</h2>
        <h3>Shoe Show Mega</h3>
        <h5>Jan 2019 - Jul 2022 (3 Years & 7 Months)</h5>
        <ul>
          <li>Demonstrated exceeding customer service skills</li>
          <li>
            Handled fast-paced micro-transactions and performed daily management
            duties
          </li>
        </ul>
        <div className="line-break"></div>
        <h2>Web Intern</h2>
        <h3>Woodlawn Villager</h3>
        <h5>Aug 2017 - Aug 2018 (1 year)</h5>
        <ul>
          <li>
            Designed & updated a WordPress website as directed by supervisor
          </li>
        </ul>
      </div>
    </div>
  );
};

export default WorkExperience;
