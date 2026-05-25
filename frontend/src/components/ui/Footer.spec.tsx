import { render, screen } from "@testing-library/react";
import Footer from "./Footer";

describe("Footer", () => {
  describe("full variant (default)", () => {
    it("renders Realização heading", () => {
      render(<Footer />);
      expect(screen.getByText("Realização:")).toBeInTheDocument();
    });

    it("renders Apoio heading", () => {
      render(<Footer />);
      expect(screen.getByText("Apoio:")).toBeInTheDocument();
    });

    it("renders logo images", () => {
      render(<Footer />);
      expect(screen.getByAltText("Computação UFBA")).toBeInTheDocument();
      expect(screen.getByAltText("UFBA")).toBeInTheDocument();
      expect(screen.getByAltText("Jusbrasil")).toBeInTheDocument();
    });

    it("renders copyright with current year", () => {
      render(<Footer />);
      const year = new Date().getFullYear().toString();
      expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
    });

    it("renders copyright text", () => {
      render(<Footer />);
      const year = new Date().getFullYear();
      expect(
        screen.getByText(`© ${year} WEPGCOMP`)
      ).toBeInTheDocument();
    });
  });

  describe("compact variant", () => {
    it("renders only copyright", () => {
      render(<Footer variant="compact" />);
      const year = new Date().getFullYear();
      expect(
        screen.getByText(`© ${year} WEPGCOMP`)
      ).toBeInTheDocument();
    });

    it("does not render Realização or Apoio", () => {
      render(<Footer variant="compact" />);
      expect(screen.queryByText("Realização:")).toBeNull();
      expect(screen.queryByText("Apoio:")).toBeNull();
    });
  });

  it("applies custom className", () => {
    const { container } = render(<Footer className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
