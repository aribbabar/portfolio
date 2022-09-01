import "../css/WorkExperience.css";

const WorkExperience = () => {
  const timeSince = (date) => {
    let seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    let time = "";

    if (interval > 1) {
      const i = Math.floor(interval);

      if (i > 1) {
        time += i + " Years";
      } else {
        time += i + " Year";
      }
    }

    interval = seconds / 2592000;

    if (interval > 1) {
      if (time === "") {
        time += (Math.floor(interval) % 10) + " Months";
      } else {
        time += " & " + (Math.floor(interval) % 10) + " Months";
      }
    }

    return time;
  };

  const detsTime = timeSince(new Date("August 01, 2021"));

  return (
    <div id="work-experience">
      <div className="title-container">
        <h2>Work Experience</h2>
      </div>
      <div className="experience-container">
        <h2>Technical Director</h2>
        <h3>Distance Education Tech & Services (DETS)</h3>
        <h5>Aug 2021 - Present ({detsTime})</h5>
        <ul>
          <li>Recorded classroom with basic staging techniques</li>
          <li>Provided support to staff & instructors</li>
        </ul>
        <div className="line-break"></div>
        <h2>Key Holder (Assistant Manager)</h2>
        <h3>Shoe Show Mega</h3>
        <h5>Jan 2019 - Jul 2022 (3 Years & 7 Months)</h5>
        <ul>
          <li>
            Demonstrated strong dependable and leadership skills by overseeing
            day-to-day store operations
          </li>
          <li>
            Handled fast-paced micro-transactions, merchandising, & cashier
            balancing
          </li>
          <li>Provided superior customer service to all customers</li>
        </ul>
        <div className="line-break"></div>
        <h2>Web Intern</h2>
        <h3>Woodlawn Villager</h3>
        <h5>Aug 2017 - Aug 2018 (1 year)</h5>
        <ul>
          <li>
            Updated & maintained a WordPress website that meets the current web
            standards
          </li>
        </ul>
      </div>
    </div>
  );
};

export default WorkExperience;
