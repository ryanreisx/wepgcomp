import { render, screen, fireEvent } from "@testing-library/react";
import SearchBar from "./SearchBar";

describe("SearchBar", () => {
  it("renders input with placeholder", () => {
    render(<SearchBar value="" onChange={() => {}} placeholder="Pesquisar..." />);
    expect(screen.getByPlaceholderText("Pesquisar...")).toBeInTheDocument();
  });

  it("renders with default placeholder", () => {
    render(<SearchBar value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText("Buscar...")).toBeInTheDocument();
  });

  it("calls onChange when typing", () => {
    const onChange = jest.fn();
    render(<SearchBar value="" onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText("Buscar..."), {
      target: { value: "test" },
    });
    expect(onChange).toHaveBeenCalledWith("test");
  });

  it("calls onSearch on button click", () => {
    const onSearch = jest.fn();
    render(<SearchBar value="query" onChange={() => {}} onSearch={onSearch} />);
    fireEvent.click(screen.getByLabelText("Buscar"));
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it("calls onSearch on Enter key", () => {
    const onSearch = jest.fn();
    render(<SearchBar value="query" onChange={() => {}} onSearch={onSearch} />);
    fireEvent.keyDown(screen.getByPlaceholderText("Buscar..."), { key: "Enter" });
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it("renders search icon button", () => {
    render(<SearchBar value="" onChange={() => {}} />);
    expect(screen.getByLabelText("Buscar")).toBeInTheDocument();
  });
});
