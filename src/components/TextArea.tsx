import "./TextArea.css";

type TextAreaProps = {
  value?: string;
  placeholder?: string;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
};

function TextArea(props: TextAreaProps) {
  const { value, placeholder, onChange, disabled } = props;
  return (
    <textarea
      className="textarea"
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      disabled={disabled}
    />
  );
}

export default TextArea;
