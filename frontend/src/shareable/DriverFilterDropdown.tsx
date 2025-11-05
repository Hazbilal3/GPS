import React, { useState, useEffect, useRef } from "react";
import { LuChevronDown } from "react-icons/lu";
import "../assets/components-css/DriverFilterDropdown.css";

interface Props {
  drivers: string[];
  selectedDrivers: string[];
  onChange: (selected: string[]) => void;
  title?: string;
}

const DriverFilterDropdown: React.FC<Props> = ({
  drivers,
  selectedDrivers,
  onChange,
  title = "Driver",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCheckboxChange = (driverName: string) => {
    let newSelected: string[];
    if (selectedDrivers.includes(driverName)) {
      newSelected = selectedDrivers.filter((name) => name !== driverName);
    } else {
      newSelected = [...selectedDrivers, driverName];
    }
    onChange(newSelected);
  };

  const handleClear = () => {
    onChange([]); // clear selected drivers
    setSearchTerm(""); // reset search
    setIsOpen(false); // close dropdown
  };

  const filteredDrivers = drivers.filter((driver) =>
    driver.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getButtonText = () => {
    if (selectedDrivers.length === 0) {
      return title;
    }
    if (selectedDrivers.length === 1) {
      return selectedDrivers[0];
    }
    return `${selectedDrivers.length} Selected`;
  };

  return (
    <div className="filter-dropdown-wrapper" ref={dropdownRef}>
      <button
        className="filter-dropdown-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{getButtonText()}</span>
        <LuChevronDown className={`filter-chevron ${isOpen ? "open" : ""}`} />
      </button>

      {isOpen && (
        <div className="filter-dropdown-menu">
          <input
            type="text"
            className="filter-search-input"
            placeholder="Find a person"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <ul className="filter-dropdown-list">
            {filteredDrivers.length > 0 ? (
              filteredDrivers.map((driver) => (
                <li
                  key={driver}
                  className="filter-dropdown-item"
                  onClick={() => handleCheckboxChange(driver)}
                >
                  <input
                    type="checkbox"
                    className="filter-checkbox"
                    checked={selectedDrivers.includes(driver)}
                    readOnly
                  />
                  <span>{driver}</span>
                </li>
              ))
            ) : (
              <li className="filter-dropdown-item-none">No drivers found</li>
            )}
          </ul>

          {selectedDrivers.length > 0 && (
            <div className="filter-clear-wrapper">
              <button className="filter-clear-btn" onClick={handleClear}>
                Clear Selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DriverFilterDropdown;
