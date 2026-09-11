import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import * as authService from "../services/authService";
import * as productService from "../services/productService";
import * as orderService from "../services/orderService";
import * as cartService from "../services/cartService";

const AppContext = createContext(null);

let notificationId = 0;

export function AppProvider({ children }) {
  // Customer auth (separate token from admin auth, matching the original
  // design where `user` and `adminUser` were fully independent).
  const [user, setUser] = useLocalStorage("user", null);
  const [token, setToken] = useLocalStorage("token", null);

  // Admin auth
  const [adminUser, setAdminUser] = useLocalStorage("adminUser", null);
  const [adminToken, setAdminToken] = useLocalStorage("adminToken", null);

  const [cart, setCart] = useLocalStorage("cart", []);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Prevents the very first cart-changed effect (on page load) from
  // immediately overwriting the server cart before we've had a chance to
  // pull it down and merge it in.
  const hasHydratedServerCart = useRef(false);

  const notify = useCallback((message, type = "success") => {
    const id = ++notificationId;
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }, []);

  // ── Products: fetched from the backend instead of the hardcoded catalog ──
  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const data = await productService.getProducts();
      setProducts(data);
    } catch (err) {
      setProductsError(err.message);
      notify(err.message, "error");
    } finally {
      setProductsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cart ──────────────────────────────────────────────────────────
  // Cart stays client-first (localStorage) exactly like before, so guests
  // can add to cart with no account. Once a customer is logged in, the
  // cart is additionally mirrored to the server so it can be restored on
  // another device/browser.
  const addToCart = useCallback(
    (product) => {
      setCart((prev) => {
        const existing = prev.find((item) => item.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.id === product.id
              ? { ...item, quantity: (item.quantity || 1) + 1 }
              : item
          );
        }
        return [...prev, { ...product, quantity: 1 }];
      });
      notify(`${product.name} added to cart!`, "success");
    },
    [setCart, notify]
  );

  const updateQuantity = useCallback(
    (productId, quantity) => {
      if (quantity <= 0) {
        setCart((prev) => prev.filter((item) => item.id !== productId));
        return;
      }
      setCart((prev) =>
        prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
      );
    },
    [setCart]
  );

  const removeFromCart = useCallback(
    (productId) => {
      setCart((prev) => prev.filter((item) => item.id !== productId));
      notify("Item removed from cart", "success");
    },
    [setCart, notify]
  );

  const clearCart = useCallback(() => setCart([]), [setCart]);

  // On login, pull down the server cart and merge it with whatever is
  // currently in the browser (summing quantities for matching products),
  // so nothing the guest already added gets lost.
  const hydrateCartFromServer = useCallback(
    async (authToken) => {
      try {
        const serverItems = await cartService.getServerCart(authToken);
        if (serverItems.length === 0) {
          hasHydratedServerCart.current = true;
          return;
        }
        setCart((prevCart) => {
          const merged = prevCart.slice();
          serverItems.forEach((serverItem) => {
            const productId = serverItem.product?._id || serverItem.product;
            const existing = merged.find((item) => item.id === productId);
            if (existing) {
              existing.quantity = (existing.quantity || 1) + (serverItem.quantity || 1);
            } else {
              merged.push({
                id: productId,
                name: serverItem.name,
                brand: serverItem.brand,
                image: serverItem.image,
                price: serverItem.price,
                quantity: serverItem.quantity || 1,
              });
            }
          });
          return merged;
        });
      } catch {
        // Non-fatal: worst case the user just keeps their local cart.
      } finally {
        hasHydratedServerCart.current = true;
      }
    },
    [setCart]
  );

  // Whenever the cart changes AND a customer is logged in, mirror it to
  // the server. Skipped until the initial server-cart hydration above has
  // finished, so we don't overwrite the server cart with a stale/empty
  // local cart on first load.
  useEffect(() => {
    if (!token || !hasHydratedServerCart.current) return;
    cartService
      .syncServerCart(
        cart.map((item) => ({
          productId: item.id,
          name: item.name,
          brand: item.brand,
          image: item.image,
          price: item.price,
          quantity: item.quantity || 1,
        })),
        token
      )
      .catch(() => {
        // Non-fatal: cart still works locally even if the sync call fails.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, token]);

  // ── Customer Auth ─────────────────────────────────────────────────
  const login = useCallback(
    async (email, password) => {
      try {
        const { user: loggedInUser, token: authToken } = await authService.login(
          email,
          password
        );
        setUser(loggedInUser);
        setToken(authToken);
        hasHydratedServerCart.current = false;
        await hydrateCartFromServer(authToken);
        notify("Logged in successfully!", "success");
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    [setUser, setToken, hydrateCartFromServer, notify]
  );

  const signup = useCallback(
    async (name, email, password, confirmPassword) => {
      if (password !== confirmPassword) {
        return { success: false, error: "Passwords do not match" };
      }
      if (password.length < 6) {
        return { success: false, error: "Password must be at least 6 characters" };
      }
      try {
        const { user: newUser, token: authToken } = await authService.register(
          name,
          email,
          password,
          confirmPassword
        );
        setUser(newUser);
        setToken(authToken);
        hasHydratedServerCart.current = true; // brand new account, nothing to merge
        notify("Account created successfully!", "success");
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    [setUser, setToken, notify]
  );

  const logout = useCallback(async () => {
    try {
      if (token) await authService.logout(token);
    } catch {
      // Logging out client-side should succeed even if the API call fails.
    }
    setUser(null);
    setToken(null);
    hasHydratedServerCart.current = false;
    notify("Logged out successfully", "success");
  }, [token, setUser, setToken, notify]);

  // ── Admin Auth ────────────────────────────────────────────────────
  const adminLogin = useCallback(
    async (email, password) => {
      try {
        const { user: admin, token: authToken } = await authService.loginAdmin(
          email,
          password
        );
        setAdminUser(admin);
        setAdminToken(authToken);
        notify("Admin logged in successfully!", "success");
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    [setAdminUser, setAdminToken, notify]
  );

  const adminLogout = useCallback(() => {
    setAdminUser(null);
    setAdminToken(null);
    notify("Admin logged out", "success");
  }, [setAdminUser, setAdminToken, notify]);

  const changeAdminPassword = useCallback(
    async (newPassword) => {
      if (!newPassword || newPassword.length < 6) {
        notify("Password must be at least 6 characters", "error");
        return;
      }
      try {
        await authService.changeAdminPassword(newPassword, adminToken);
        notify("Admin password updated successfully!", "success");
      } catch (err) {
        notify(err.message, "error");
      }
    },
    [adminToken, notify]
  );

  // ── Products (admin CRUD) ────────────────────────────────────────
  const addProduct = useCallback(
    async (productData) => {
      try {
        const newProduct = await productService.createProduct(productData, adminToken);
        setProducts((prev) => [newProduct, ...prev]);
        notify("Product added successfully!", "success");
        return { success: true, product: newProduct };
      } catch (err) {
        notify(err.message, "error");
        return { success: false, error: err.message };
      }
    },
    [adminToken, notify]
  );

  const deleteProduct = useCallback(
    async (productId) => {
      try {
        await productService.deleteProduct(productId, adminToken);
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        notify("Product deleted", "success");
      } catch (err) {
        notify(err.message, "error");
      }
    },
    [adminToken, notify]
  );

  const clearAllData = useCallback(async () => {
    try {
      await Promise.all(products.map((p) => productService.deleteProduct(p.id, adminToken)));
      await orderService.deleteAllOrders(adminToken);
      setProducts([]);
      setOrders([]);
      notify("All data cleared", "success");
    } catch (err) {
      notify(err.message, "error");
    }
  }, [products, adminToken, notify]);

  const importData = useCallback(
    async (data) => {
      if (!data.products || !Array.isArray(data.products)) {
        notify("Invalid backup file - no products found", "error");
        return;
      }
      try {
        const created = [];
        for (const p of data.products) {
          if (!p.name || !p.brand || !p.type || !p.price || !p.image) continue;
          // eslint-disable-next-line no-await-in-loop
          const product = await productService.createProduct(
            {
              name: p.name,
              brand: p.brand,
              type: p.type,
              price: p.price,
              originalPrice: p.originalPrice || null,
              stock: p.stock || 0,
              rating: p.rating || 4,
              description: p.description || "",
              image: p.image,
            },
            adminToken
          );
          created.push(product);
        }
        setProducts((prev) => [...created, ...prev]);
        notify(
          `Imported ${created.length} product(s). Orders are not imported - they come from real checkouts.`,
          "success"
        );
      } catch (err) {
        notify(err.message, "error");
      }
    },
    [adminToken, notify]
  );

  // ── Orders ────────────────────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    if (!adminToken) return;
    try {
      const data = await orderService.getAllOrders(adminToken);
      setOrders(data);
    } catch (err) {
      notify(err.message, "error");
    }
  }, [adminToken, notify]);

  useEffect(() => {
    if (adminUser && adminToken) loadOrders();
  }, [adminUser, adminToken, loadOrders]);

  const placeOrder = useCallback(
    async (shippingAddress, total) => {
      const order = await orderService.placeOrder(
        {
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity || 1,
          })),
          shippingAddress,
          paymentMethod: "cod",
        },
        token
      );
      setOrders((prev) => [order, ...prev]);
      clearCart();
      return order;
    },
    [cart, token, clearCart]
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + (item.quantity || 1), 0),
    [cart]
  );

  const value = {
    user,
    login,
    signup,
    logout,
    adminUser,
    adminLogin,
    adminLogout,
    changeAdminPassword,
    cart,
    cartCount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    products,
    productsLoading,
    productsError,
    refreshProducts: loadProducts,
    addProduct,
    deleteProduct,
    clearAllData,
    importData,
    orders,
    placeOrder,
    notifications,
    notify,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}
