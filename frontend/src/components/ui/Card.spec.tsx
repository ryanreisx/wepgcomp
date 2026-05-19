import { render, screen, fireEvent } from "@testing-library/react";
import Card from "./Card";

describe("Card", () => {
  it("renders title", () => {
    render(<Card title="Test Card" />);
    expect(screen.getByText("Test Card")).toBeInTheDocument();
  });

  it("renders subtitle", () => {
    render(<Card title="Title" subtitle="Subtitle text" />);
    expect(screen.getByText("Subtitle text")).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(<Card title="Title"><span>Extra info</span></Card>);
    expect(screen.getByText("Extra info")).toBeInTheDocument();
  });

  it("renders edit button and handles click", () => {
    const onEdit = jest.fn();
    render(<Card title="Title" onEdit={onEdit} />);
    const btn = screen.getByLabelText("Editar");
    fireEvent.click(btn);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("renders delete button and handles click", () => {
    const onDelete = jest.fn();
    render(<Card title="Title" onDelete={onDelete} />);
    const btn = screen.getByLabelText("Excluir");
    fireEvent.click(btn);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("renders star button and handles click", () => {
    const onStar = jest.fn();
    render(<Card title="Title" onStar={onStar} />);
    const btn = screen.getByLabelText("Favoritar");
    fireEvent.click(btn);
    expect(onStar).toHaveBeenCalledTimes(1);
  });

  it("shows starred label when starred", () => {
    render(<Card title="Title" onStar={() => {}} starred />);
    expect(screen.getByLabelText("Remover favorito")).toBeInTheDocument();
  });

  it("does not render actions when no callbacks provided", () => {
    render(<Card title="Title" />);
    expect(screen.queryByLabelText("Editar")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Excluir")).not.toBeInTheDocument();
  });
});
