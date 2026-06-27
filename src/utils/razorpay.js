import Razorpay from "razorpay";

const { RAZORPAY_KEY, ROZARPAY_SECRET } = process.env;

const instance = RAZORPAY_KEY && ROZARPAY_SECRET
  ? new Razorpay({
      key_id:process.env.RAZORPAY_KEY,
      key_secret:process.env.ROZARPAY_SECRET,
    })
  : null;

export { instance };

