import { render, screen, fireEvent } from "@testing-library/react";
import Modal from "./Modal";

describe("Modal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: "Test Modal",
    children: <p>Modal content</p>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders when isOpen is true", () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onClose when X button is clicked", () => {
    render(<Modal {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Fechar"));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when overlay is clicked", () => {
    render(<Modal {...defaultProps} />);
    fireEvent.click(screen.getByRole("dialog"));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when modal content is clicked", () => {
    render(<Modal {...defaultProps} />);
    fireEvent.click(screen.getByText("Modal content"));
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it("calls onClose on Escape key", () => {
    render(<Modal {...defaultProps} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("applies success variant class", () => {
    render(<Modal {...defaultProps} variant="success" />);
    const title = screen.getByText("Test Modal");
    expect(title.parentElement!.className).toContain("modal--success");
  });

  it("applies error variant class", () => {
    render(<Modal {...defaultProps} variant="error" />);
    const title = screen.getByText("Test Modal");
    expect(title.parentElement!.className).toContain("modal--error");
  });
});
