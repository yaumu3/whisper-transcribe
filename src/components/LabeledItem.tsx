import "./LabeledItem.css";

type LabeledItemProps = {
  title: string;
  grow?: boolean;
  tooltipElement?: JSX.Element;
  children: JSX.Element;
};

function LabeledItem(props: LabeledItemProps) {
  const { title, grow, tooltipElement } = props;
  return (
    <div className={`labeled-item-wrapper ${grow ? "label-item-grow" : ""}`}>
      <div className="labeled-item-title">
        {title}
        {tooltipElement ? (
          <div className="labeled-item-help-wrapper">
            <div className="labeled-item-help-icon" />
            <span className="labeled-item-help-tooltip">{tooltipElement}</span>
          </div>
        ) : (
          ""
        )}
      </div>
      {props.children}
    </div>
  );
}

export default LabeledItem;
