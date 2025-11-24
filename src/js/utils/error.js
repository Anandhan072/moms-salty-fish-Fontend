import icons from "./icon.svg"
export const errorMessage =  async () => {
  const el = document.getElementById("main");

  if (!el) return;

  el.innerHTML = `
    <style>
      .error-wrapper {
        height: 70vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        animation: fadeIn 0.6s ease-in-out;
        font-family: "Poppins", Arial, sans-serif;
        position: relative;
        overflow: hidden;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .error-card {
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(10px);
        padding: 40px 60px;
        border-radius: 18px;
        text-align: center;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        animation: floatUp 0.8s ease;
      }

      @keyframes floatUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .error-title {
        font-size: 70px;
        font-weight: 700;
        color: #2a6af4;
        margin-bottom: 10px;
        letter-spacing: 2px;
      }

      .error-subtitle {
        font-size: 22px;
        color: #444;
        margin-bottom: 25px;
      }

      /* Button */
      .back-home-btn {
        padding: 12px 30px;
        font-size: 16px;
        background: #2a6af4;
        color: white;
        border-radius: 8px;
        text-decoration: none;
        display: inline-block;
        transition: 0.3s;
      }

      .back-home-btn:hover {
        background: #174bcc;
      }

      /* Floating fish animation */
      .fish {
        position: absolute;
        width: 120px;
        opacity: 2;
        left: 0px;
        animation: swim 12s infinite linear;
      }

      @keyframes swim {
        from { transform: translateX(0px); }
        to { transform: translateX(100vw); }
      }

      .fish.f1 { top: 15%; animation-duration: 10s; }
      .fish.f2 { top: 40%; width: 90px; animation-duration: 8s; }
      .fish.f3 { top: 70%; width: 130px; animation-duration: 13s; }
    </style>

    <div class="error-wrapper">
      
      <!-- Floating animated fish -->
      <section class="fish f1"> <svg class="icon" width="24" height="24">
                      <use href="${icons}#icon-fish-offer"></use>
                    </svg> </section>
      <section class="fish f2"> <svg class="icon" width="24" height="24">
                      <use href="${icons}#icon-fish-offer"></use>
                    </svg> </section>
      <section class="fish f3"> <svg class="icon" width="24" height="24">
                      <use href="${icons}#icon-fish-offer"></use>
                    </svg> </section>

      <div class="error-card">
        <div class="error-title">404</div>
        <div class="error-subtitle">Oops! The page you're looking for doesn't exist.</div>
        <a href="/home" class="back-home-btn">Go Back Home</a>
      </div>
    </div>
  `;
};


