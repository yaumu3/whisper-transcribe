import "./TextArea.css";

type TextAreaProps = {
  value?: string;
  placeholder?: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

function TextArea(props: TextAreaProps) {
  const { value, placeholder, onChange } = props;
  return (
    <textarea
      className="textarea"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event)}
    />
  );
}

export default TextArea;
