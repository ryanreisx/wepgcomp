import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FavoriteToggle from "./FavoriteToggle";
import * as favoriteService from "@/services/favorite.service";

jest.mock("@/services/favorite.service");

const mockedFavService = favoriteService as jest.Mocked<
  typeof favoriteService
>;

describe("FavoriteToggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders unfilled star when not favorite", () => {
    render(
      <FavoriteToggle presentationId="p1" initialIsFavorite={false} />
    );
    expect(screen.getByLabelText("Favoritar")).toBeInTheDocument();
  });

  it("renders filled star when favorite", () => {
    render(
      <FavoriteToggle presentationId="p1" initialIsFavorite={true} />
    );
    expect(screen.getByLabelText("Remover favorito")).toBeInTheDocument();
  });

  it("toggles optimistically from unfilled to filled", async () => {
    mockedFavService.addBookmark.mockResolvedValue({} as never);
    const onChange = jest.fn();

    render(
      <FavoriteToggle
        presentationId="p1"
        initialIsFavorite={false}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByLabelText("Favoritar"));

    expect(screen.getByLabelText("Remover favorito")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockedFavService.addBookmark).toHaveBeenCalledWith("p1");
    });
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("toggles optimistically from filled to unfilled", async () => {
    mockedFavService.removeBookmark.mockResolvedValue({} as never);
    const onChange = jest.fn();

    render(
      <FavoriteToggle
        presentationId="p1"
        initialIsFavorite={true}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByLabelText("Remover favorito"));

    expect(screen.getByLabelText("Favoritar")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockedFavService.removeBookmark).toHaveBeenCalledWith("p1");
    });
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("reverts state and shows toast on network error", async () => {
    mockedFavService.addBookmark.mockRejectedValue(new Error("Network"));

    render(
      <FavoriteToggle presentationId="p1" initialIsFavorite={false} />
    );

    fireEvent.click(screen.getByLabelText("Favoritar"));

    expect(screen.getByLabelText("Remover favorito")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText("Favoritar")).toBeInTheDocument();
    });
    expect(
      screen.getByText("Erro ao atualizar favorito.")
    ).toBeInTheDocument();
  });

  it("stops event propagation on click", () => {
    const parentClick = jest.fn();
    mockedFavService.addBookmark.mockResolvedValue({} as never);

    render(
      <div onClick={parentClick}>
        <FavoriteToggle presentationId="p1" initialIsFavorite={false} />
      </div>
    );

    fireEvent.click(screen.getByLabelText("Favoritar"));
    expect(parentClick).not.toHaveBeenCalled();
  });
});
