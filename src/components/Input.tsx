import "./Input.css";

type InputProps = {
  type: string;
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  spellcheck?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
};

function Input(props: InputProps) {
  const {
    type,
    placeholder,
    value,
    onChange,
    spellcheck,
    maxLength,
    min,
    max,
    step,
  } = props;
  return (
    <input
      className="input"
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      spellCheck={spellcheck}
      maxLength={maxLength}
      min={min}
      max={max}
      step={step}
    ></input>
  );
}

export default Input;
