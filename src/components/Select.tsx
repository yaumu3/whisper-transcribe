import "./Input.css";

type SelectProps = {
  value?: string;
  values: string[];
  onChange?: React.FormEventHandler<HTMLSelectElement>;
};

function Select(props: SelectProps) {
  const { value, values, onChange } = props;
  return (
    <select className="select" value={value} onChange={onChange}>
      {values.map((value) => (
        <option key={value} value={value}>
          {value}
        </option>
      ))}
    </select>
  );
}

export default Select;
