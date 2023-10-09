import "./TextArea.css";

type TextAreaProps = {
  value?: string;
  placeholder?: string;
};

function TextArea(props: TextAreaProps) {
  const { value, placeholder } = props;
  return (
    <textarea className="textarea" value={value} placeholder={placeholder} />
  );
}

export default TextArea;
