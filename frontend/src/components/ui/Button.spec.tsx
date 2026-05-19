import { render, screen, fireEvent } from "@testing-library/react";
import Button from "./Button";

describe("Button", () => {
  it("renders children text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("applies filled primary classes by default", () => {
    render(<Button>Default</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("btn--filled");
    expect(btn.className).toContain("btn--primary");
  });

  it("applies outline variant class", () => {
    render(<Button variant="outline">Outline</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("btn--outline");
  });

  it("applies secondary color class", () => {
    render(<Button color="secondary">Secondary</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("btn--secondary");
  });

  it("handles click events", () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("supports disabled state", () => {
    const onClick = jest.fn();
    render(<Button disabled onClick={onClick}>Disabled</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("passes extra className", () => {
    render(<Button className="extra">Cls</Button>);
    expect(screen.getByRole("button").className).toContain("extra");
  });
});
