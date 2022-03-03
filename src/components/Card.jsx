import "../css/Card.css";

const Card = ({ img, link, title, desc, classes }) => {
  let classNames = "";

  if(classes != undefined) {
    classNames = classes;
  }

  return (
    <div
      className={"card" + classNames}
      onClick={() => {
        if (link) {
          window.open(link, "_blank");
        }
      }}
    >
      <img src={img} alt="" />
      <div className="card-content-container">
        <h2>{title}</h2>
        <p>{desc}</p>
      </div>
    </div>
  );
};

export default Card;
