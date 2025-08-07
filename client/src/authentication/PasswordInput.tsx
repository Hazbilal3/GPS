import React, { useState } from "react";
import { Eye, EyeSlash } from "react-bootstrap-icons";

interface Props {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

const PasswordInput: React.FC<Props> = ({ value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="position-relative">
      <input
        type={show ? "text" : "password"}
        className="form-control mb-3"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      <span
        className="password-toggle"
        onClick={() => setShow(!show)}
        style={{ cursor: "pointer" }}
      >
        {show ? <EyeSlash /> : <Eye />}
      </span>
    </div>
  );
};

export default PasswordInput;
