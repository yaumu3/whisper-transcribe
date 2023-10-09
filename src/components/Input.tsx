import "./Input.css";

type InputProps = {
  type: string;
  placeholder?: string;
  value?: string;
  spellcheck?: boolean;
};

function Input(props: InputProps) {
  const { type, placeholder, value, spellcheck } = props;
  return (
    <input
      className="input"
      type={type}
      placeholder={placeholder}
      value={value}
      spellCheck={spellcheck}
    ></input>
  );
}

export default Input;
