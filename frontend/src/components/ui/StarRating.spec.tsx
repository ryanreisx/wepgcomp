import { render, screen, fireEvent } from "@testing-library/react";
import StarRating from "./StarRating";

describe("StarRating", () => {
  it("renders 5 stars by default", () => {
    render(<StarRating value={0} />);
    const stars = screen.getAllByRole("button");
    expect(stars).toHaveLength(5);
  });

  it("renders custom number of stars", () => {
    render(<StarRating value={0} maxStars={10} />);
    expect(screen.getAllByRole("button")).toHaveLength(10);
  });

  it("fills stars up to value", () => {
    render(<StarRating value={3} />);
    const stars = screen.getAllByRole("button");
    expect(stars[0].className).toContain("star--filled");
    expect(stars[1].className).toContain("star--filled");
    expect(stars[2].className).toContain("star--filled");
    expect(stars[3].className).not.toContain("star--filled");
    expect(stars[4].className).not.toContain("star--filled");
  });

  it("calls onChange when star is clicked", () => {
    const onChange = jest.fn();
    render(<StarRating value={0} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("3 estrelas"));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("disables buttons in readOnly mode", () => {
    render(<StarRating value={4} readOnly />);
    const stars = screen.getAllByRole("button");
    stars.forEach((star) => expect(star).toBeDisabled());
  });

  it("has aria-label on group", () => {
    render(<StarRating value={0} />);
    expect(screen.getByRole("group")).toHaveAttribute(
      "aria-label",
      "Avaliação por estrelas",
    );
  });

  it("shows hover state on mouse enter", () => {
    render(<StarRating value={0} onChange={() => {}} />);
    const stars = screen.getAllByRole("button");
    fireEvent.mouseEnter(stars[3]);
    expect(stars[0].className).toContain("star--filled");
    expect(stars[3].className).toContain("star--filled");
    expect(stars[4].className).not.toContain("star--filled");
  });
});
