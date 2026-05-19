import { render, screen } from "@testing-library/react";
import Footer from "./Footer";

describe("Footer", () => {
  it("renders contact email", () => {
    render(<Footer contactEmail="test@ufba.br" />);
    const link = screen.getByText("test@ufba.br");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "mailto:test@ufba.br");
  });

  it("renders contact phone", () => {
    render(<Footer contactPhone="(71) 99999-0000" />);
    expect(screen.getByText("(71) 99999-0000")).toBeInTheDocument();
  });

  it("renders location", () => {
    render(<Footer location="Salvador, BA" />);
    expect(screen.getByText("Salvador, BA")).toBeInTheDocument();
  });

  it("renders copyright with current year", () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it("renders section headings", () => {
    render(<Footer />);
    expect(screen.getByText("Contato")).toBeInTheDocument();
    expect(screen.getByText("Local")).toBeInTheDocument();
  });

  it("renders partner logos", () => {
    render(<Footer logosSrc={["/logo1.png", "/logo2.png"]} />);
    const imgs = screen.getAllByRole("img");
    expect(imgs).toHaveLength(2);
  });
});
