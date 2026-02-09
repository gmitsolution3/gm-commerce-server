export function calculateRisk(visitor: any) {
  let score = 0;

  const checkout = visitor?.paths?.find((p: any) => p.route === "/checkout");

  if (checkout) {
    const t = checkout.timeSpent ?? 0;

    if (t < 15000) {
      console.log("score 30");
      score += 30;
    } else if (t <= 30000) {
      console.log("score 20");
      score += 20;
    } else if (t <= 45000) {
      console.log("score 10");
      score += 15;
    }

    const scroll = checkout.scrollDepth;
    if (scroll < 20) {
      console.log("scroll 20 added");
      score += 20;
    } else if (scroll <= 40) {
      console.log("scroll 15 added");
      score += 15;
    }

    if ((checkout.mouseMoves ?? 0) < 30 && (checkout.touch ?? 0) < 20) {
      console.log("mouse move 20 added");
      score += 20;
    }

    if ((checkout.clicks ?? 0) < 6) {
      console.log("clicks 10 added");
      score += 10;
    }
  }

  if (visitor?.fraud?.invalidCount > 0) {
    console.log("fraud *2 added");
    score += visitor.fraud.invalidCount * 10;
  }

  if (visitor?.accuracy != null && visitor.accuracy > 30000) {
    console.log("accuracy 10 added");
    score += 10;
  }

  if (/bot|crawler|spider/i.test(visitor?.userAgent || "")) {
    console.log("user agent 50 added");
    score += 50;
  }

  if (visitor?.paths?.length < 3) {
    console.log("paths length 20 added");
    score += 20;
  }

  return Math.min(score, 100);
}
