import "./header.scss";

export function Header() {
  return (
    <header className="app-header">
      <div className="app-header__left">
        <h1 className="app-header__title">UniReq</h1>
        <span className="app-header__subtitle">
          Sistema de Requerimentos
        </span>
      </div>

      <div className="app-header__right">
        <div className="app-header__user">
          <span className="app-header__user-name">Administrador</span>
        </div>
      </div>
    </header>
  );
}