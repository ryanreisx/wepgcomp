import { render, screen, fireEvent } from "@testing-library/react";
import Navbar from "./Navbar";

describe("Navbar", () => {
  it("renders logo text", () => {
    render(<Navbar />);
    expect(screen.getByText("PGCOMP")).toBeInTheDocument();
  });

  it("renders custom logo text", () => {
    render(<Navbar logoText="Custom Logo" />);
    expect(screen.getByText("Custom Logo")).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    const links = [
      { label: "Inicio", href: "/" },
      { label: "Orientações", href: "/orientacoes" },
    ];
    render(<Navbar links={links} />);
    expect(screen.getByText("Inicio")).toBeInTheDocument();
    expect(screen.getByText("Orientações")).toBeInTheDocument();
  });

  it("renders login link by default", () => {
    render(<Navbar />);
    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("renders hamburger button when showHamburger is true", () => {
    const onClick = jest.fn();
    render(<Navbar showHamburger onHamburgerClick={onClick} />);
    const btn = screen.getByLabelText("Menu");
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("toggles mobile menu", () => {
    render(
      <Navbar
        links={[{ label: "Home", href: "/" }]}
      />,
    );
    const toggle = screen.getByLabelText("Abrir menu");
    fireEvent.click(toggle);
    // After click, the links container should have the open class
    const homeLink = screen.getByText("Home");
    expect(homeLink.closest("ul")!.className).toContain("links--open");
  });
});
