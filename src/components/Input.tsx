import "./Input.css";

type InputProps = {
  type: string;
  placeholder?: string;
  value?: string;
  spellcheck?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

function Input(props: InputProps) {
  const { type, placeholder, value, spellcheck, onChange } = props;
  return (
    <input
      className="input"
      type={type}
      placeholder={placeholder}
      value={value}
      spellCheck={spellcheck}
      onChange={(event) => onChange(event)}
    ></input>
  );
}

export default Input;
