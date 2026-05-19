import { render, screen, fireEvent } from "@testing-library/react";
import Input from "./Input";

describe("Input", () => {
  it("renders without label", () => {
    render(<Input name="test" />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders label text", () => {
    render(<Input label="Email" name="email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("shows required asterisk", () => {
    render(<Input label="Nome" name="nome" required />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("shows error message", () => {
    render(<Input label="Email" name="email" error="Campo obrigatório" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Campo obrigatório");
  });

  it("sets aria-invalid when error is present", () => {
    render(<Input name="email" error="Erro" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("handles change events", () => {
    const onChange = jest.fn();
    render(<Input name="test" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "abc" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("applies error class when error exists", () => {
    render(<Input name="test" error="Erro" />);
    expect(screen.getByRole("textbox").className).toContain("input--error");
  });
});
