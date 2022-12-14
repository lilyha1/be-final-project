const request = require("supertest");
const app = require("../app.js");
const db = require("../db/connection.js");
const seed = require("../db/seeds/seed.js");
const testData = require("../db/data/test-data/index.js");

const endpoints_json = require("../endpoints.json");

afterAll(() => {
  return db.end();
});
beforeEach(() => seed(testData));

describe("1. GET /api/categories", () => {
  test("status:200, responds with an array of category objects each with properties: slug and description", () => {
    return request(app)
      .get("/api/categories")
      .expect(200)
      .then(({ body }) => {
        const { categories } = body;
        expect(categories).toBeInstanceOf(Array);
        expect(categories).toHaveLength(4);
        categories.forEach((categories) => {
          expect(categories).toEqual(
            expect.objectContaining({
              slug: expect.any(String),
              description: expect.any(String),
            })
          );
        });
      });
  });
});

describe("2. GET /api/reviews", () => {
  test("status:200, responds with an array of review objects each with correct properties", () => {
    return request(app)
      .get("/api/reviews")
      .expect(200)
      .then(({ body }) => {
        const { reviews } = body;
        expect(reviews).toBeInstanceOf(Array);
        expect(reviews).toHaveLength(13);
        expect(reviews).toBeSortedBy("created_at", { descending: true });
        reviews.forEach((reviews) => {
          expect(reviews).toEqual(
            expect.objectContaining({
              owner: expect.any(String),
              title: expect.any(String),
              review_id: expect.any(Number),
              category: expect.any(String),
              review_img_url: expect.any(String),
              created_at: expect.any(String),
              votes: expect.any(Number),
              designer: expect.any(String),
              comment_count: expect.any(Number),
            })
          );
        });
      });
  });
});

describe("3. GET /api/reviews/:review_id", () => {
  test("status:200, responds with a review object each with correct properties", () => {
    return request(app)
      .get("/api/reviews/3")
      .expect(200)
      .then(({ body }) => {
        const { review } = body;
        expect(review).toEqual(
          expect.objectContaining({
            review_id: 3,
            title: expect.any(String),
            review_body: expect.any(String),
            designer: expect.any(String),
            review_img_url: expect.any(String),
            votes: expect.any(Number),
            category: expect.any(String),
            owner: expect.any(String),
            created_at: expect.any(String),
          })
        );
      });
  });

  test("status:404, msg: no review found with that id ", () => {
    return request(app)
      .get("/api/reviews/1000")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("No review found for review_id: 1000");
      });
  });
  test("status:400, msg: bad request", () => {
    return request(app)
      .get("/api/reviews/not-a-review")
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Bad request");
      });
  });
});

describe("4. GET /api/reviews/:review_id/comments", () => {
  test("status: 200, responds with an array of comments", () => {
    return request(app)
      .get("/api/reviews/3/comments")
      .expect(200)
      .then(({ body }) => {
        const { comments } = body;
        expect(comments).toBeInstanceOf(Array);
        expect(comments).toHaveLength(3);
        expect(comments).toBeSortedBy("created_at", {
          descending: true,
        });
        comments.forEach((comment) => {
          expect(comment).toEqual(
            expect.objectContaining({
              comment_id: expect.any(Number),
              votes: expect.any(Number),
              created_at: expect.any(String),
              author: expect.any(String),
              body: expect.any(String),
              review_id: 3,
            })
          );
        });
      });
  });
  test("status: 404, msg:Resource not found when invalid review_id", () => {
    return request(app)
      .get("/api/reviews/1000/comments")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("Resource not found");
      });
  });

  test("status: 200, empty array when valid review_id but no comments", () => {
    return request(app)
      .get("/api/reviews/5/comments")
      .expect(200)
      .then(({ body }) => {
        expect(body.comments).toEqual([]);
      });
  });
});

describe("5. POST /api/reviews/:review_id/comments", () => {
  test("status: 200, returns object with posted comment ", () => {
    const comment = { username: "dav3rid", body: "could be better" };
    return request(app)
      .post("/api/reviews/3/comments")
      .send(comment)
      .expect(201)
      .then(({ body }) => {
        expect(body.comment).toMatchObject({
          comment_id: 7,
          votes: 0,
          created_at: expect.any(String),
          author: comment.username,
          body: comment.body,
          review_id: 3,
        });
      });
  });

  test("status: 404, msg: resource not found - non-existent review_id", () => {
    const comment = { username: "dav3rid", body: "could be better" };
    return request(app)
      .post("/api/reviews/10000/comments")
      .send(comment)
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("Resource not found");
      });
  });
  test("status: 404, non-existent user", () => {
    const comment = { username: "hlily", body: "could be better" };
    return request(app)
      .post("/api/reviews/3/comments")
      .send(comment)
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("Resource not found");
      });
  });

  test("status: 400, invalid review id", () => {
    const comment = { username: "hlily", body: "could be better" };
    return request(app)
      .post("/api/reviews/not-a-review/comments")
      .send(comment);
  });

  test("status: 400, not enough info on the post request", () => {
    const comment = { body: "could be better" };
    return request(app)
      .post("/api/reviews/3/comments")
      .send(comment)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Bad request");
      });
  });
});

describe("6. PATCH /api/reviews/:review_id", () => {
  test("status: 202, responds with updated review (increase)", () => {
    const increaseVotes = {
      inc_votes: 100,
    };
    return request(app)
      .patch("/api/reviews/3")
      .send(increaseVotes)
      .expect(202)
      .then(({ body }) => {
        const { review } = body;
        expect(review).toMatchObject({
          review_id: 3,
          title: expect.any(String),
          category: expect.any(String),
          designer: expect.any(String),
          owner: expect.any(String),
          review_body: expect.any(String),
          review_img_url: expect.any(String),
          created_at: expect.any(String),
          votes: 105,
        });
      });
  });
  test("status: 202, responds with updated review (decrease) ", () => {
    const decreaseVotes = {
      inc_votes: -100,
    };
    return request(app)
      .patch("/api/reviews/3")
      .send(decreaseVotes)
      .expect(202)
      .then(({ body }) => {
        const { review } = body;
        expect(review).toMatchObject({
          review_id: 3,
          title: expect.any(String),
          category: expect.any(String),
          designer: expect.any(String),
          owner: expect.any(String),
          review_body: expect.any(String),
          review_img_url: expect.any(String),
          created_at: expect.any(String),
          votes: -95,
        });
      });
  });

  test("status: 404, msg: Resource not found - when invalid review_id provided", () => {
    const decreaseVotes = {
      inc_votes: -100,
    };
    return request(app)
      .patch("/api/reviews/10000")
      .send(decreaseVotes)
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("Resource not found");
      });
  });

  test("should status: 400, no votes included on req body", () => {
    const noVotes = { not_vote: 1 };
    return request(app)
      .patch("/api/reviews/3")
      .send(noVotes)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Bad request");
      });
  });

  test("should status: 202, even when some other property included on req body (ignore other property", () => {
    const increaseVotes = {
      inc_votes: 100,
      name: "Mitch",
    };
    return request(app)
      .patch("/api/reviews/3")
      .send(increaseVotes)
      .expect(202)
      .then(({ body }) => {
        const { review } = body;
        expect(review).toMatchObject({
          review_id: 3,
          title: expect.any(String),
          category: expect.any(String),
          designer: expect.any(String),
          owner: expect.any(String),
          review_body: expect.any(String),
          review_img_url: expect.any(String),
          created_at: expect.any(String),
          votes: 105,
        });
      });
  });

  test("should status: 400, no inc_votes on the req body", () => {
    const noVotes = {};
    return request(app)
      .patch("/api/reviews/3")
      .send(noVotes)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Bad request");
      });
  });

  test("should status: 400, invalid review id", () => {
    const decreaseVotes = {
      inc_votes: -100,
    };
    return request(app)
      .patch("/api/reviews/not-a-review")
      .send(decreaseVotes)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Bad request");
      });
  });

  test("should status: 400, inc_votes included but invalid value", () => {
    const nonsenseVotes = {
      inc_votes: "cat",
    };
    return request(app)
      .patch("/api/reviews/not-a-review")
      .send(nonsenseVotes)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Bad request");
      });
  });
});

describe("7. GET /api/users", () => {
  test("status: 200, responds with an array of objects that contain username, name, avatar_url", () => {
    return request(app)
      .get("/api/users")
      .expect(200)
      .then(({ body }) => {
        const { users } = body;
        expect(users).toBeInstanceOf(Array);
        expect(users).toHaveLength(4);
        users.forEach((user) => {
          expect(user).toMatchObject({
            username: expect.any(String),
            name: expect.any(String),
            avatar_url: expect.any(String),
          });
        });
      });
  });
});

describe("8. GET /api/reviews (queries)", () => {
  test("status:200, responds with array of reviews in the indicated category (query)", () => {
    return request(app)
      .get("/api/reviews?category=dexterity")
      .expect(200)
      .then(({ body }) => {
        const { reviews } = body;
        expect(reviews).toBeInstanceOf(Array);
        expect(reviews).toHaveLength(1);
        reviews.forEach((reviews) => {
          expect(reviews).toEqual(
            expect.objectContaining({
              owner: expect.any(String),
              title: expect.any(String),
              review_id: expect.any(Number),
              category: "dexterity",
              review_img_url: expect.any(String),
              created_at: expect.any(String),
              votes: expect.any(Number),
              designer: expect.any(String),
              comment_count: expect.any(Number),
            })
          );
        });
      });
  });

  test("status:200, sorts by valid column)", () => {
    return request(app)
      .get("/api/reviews?sort_by=title")
      .expect(200)
      .then(({ body }) => {
        const { reviews } = body;
        expect(reviews).toBeInstanceOf(Array);
        expect(reviews).toHaveLength(13);
        expect(reviews).toBeSortedBy("title", { descending: true });
      });
  });

  test("status:200, sorts by asc)", () => {
    return request(app)
      .get("/api/reviews?sort_by=title&order=ASC")
      .expect(200)
      .then(({ body }) => {
        const { reviews } = body;
        expect(reviews).toBeInstanceOf(Array);
        expect(reviews).toHaveLength(13);
        expect(reviews).toBeSortedBy("title", { ascending: true });
      });
  });

  test("status:200, category and sorts by asc", () => {
    return request(app)
      .get("/api/reviews?category=social deduction&sort_by=title&order=ASC")
      .expect(200)
      .then(({ body }) => {
        const { reviews } = body;
        expect(reviews).toHaveLength(11);
        expect(reviews).toBeSortedBy("title", { ascending: true });
        reviews.forEach((reviews) => {
          expect(reviews).toEqual(
            expect.objectContaining({
              category: "social deduction",
            })
          );
        });
      });
  });

  test("status:404, category does not exist", () => {
    return request(app)
      .get("/api/reviews?category=fun")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("No reviews found");
      });
  });

  test("status:400, invalid sort query", () => {
    return request(app)
      .get("/api/reviews?sort_by=invalid")
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("invalid sort query");
      });
  });

  test("status:404, category exist but has no reviews", () => {
    return request(app)
      .get("/api/reviews?category=children's games")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("No reviews found");
      });
  });
});

describe("9. GET /api/reviews/:review_id (comment count)", () => {
  test("status:200, responds with a review object each with correct properties - including comment count", () => {
    return request(app)
      .get("/api/reviews/3")
      .expect(200)
      .then(({ body }) => {
        const { review } = body;
        expect(review).toEqual(
          expect.objectContaining({
            review_id: 3,
            title: expect.any(String),
            review_body: expect.any(String),
            designer: expect.any(String),
            review_img_url: expect.any(String),
            votes: expect.any(Number),
            category: expect.any(String),
            owner: expect.any(String),
            created_at: expect.any(String),
            comment_count: 3,
          })
        );
      });
  });
  test("status:200, responds with a review object each with correct properties - including comment count of 0 when there are no comments", () => {
    return request(app)
      .get("/api/reviews/1")
      .expect(200)
      .then(({ body }) => {
        const { review } = body;
        expect(review).toEqual(
          expect.objectContaining({
            review_id: 1,
            title: expect.any(String),
            review_body: expect.any(String),
            designer: expect.any(String),
            review_img_url: expect.any(String),
            votes: expect.any(Number),
            category: expect.any(String),
            owner: expect.any(String),
            created_at: expect.any(String),
            comment_count: 0,
          })
        );
      });
  });
});

describe("10. GET/api", () => {
  test("status 200, JSON describing all endpoints of the API", () => {
    return request(app)
      .get("/api")
      .expect(200)
      .then(({ body }) => {
        const { endpoints } = body;
        expect(endpoints).toBeInstanceOf(Object);
        expect(endpoints).toEqual(endpoints_json);
      });
  });
});

describe("11. DELETE /api/comments/:comment_id", () => {
  test("status: 204, no content ", () => {
    return request(app).delete("/api/comments/1").expect(204);
  });

  test("status: 404, comment_id valid but non-existent", () => {
    return request(app)
      .delete("/api/comments/100000")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("Resource not found");
      });
  });

  test("status: 400, comment_id not valid", () => {
    return request(app)
      .delete("/api/comments/not-an-id")
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Bad request");
      });
  });
});

describe("12. GET /api/users/username", () => {
  test("status: 200, returns obj with selected user from username", () => {
    return request(app)
      .get("/api/users/philippaclaire9")
      .expect(200)
      .then(({ body }) => {
        const { user } = body;
        expect(user).toMatchObject({
          username: "philippaclaire9",
          name: "philippa",
          avatar_url:
            "https://avatars2.githubusercontent.com/u/24604688?s=460&v=4",
        });
      });
  });
  test("status: 404, user not found (valid but non-esistent)", () => {
    return request(app)
      .get("/api/users/hlilya")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("Resource not found");
      });
  });
});

describe("13. PATCH /api/comments/:comment_id", () => {
  const votes = { inc_votes: 100 };
  return request(app)
    .patch("/api/comments/3")
    .send(votes)
    .expect(202)
    .then(({ body }) => {
      const { comment } = body;
      expect(comment).toMatchObject({
        comment_id: 3,
        body: "I didn't know dogs could play games",
        votes: 110,
        author: "philippaclaire9",
        review_id: 3,
        created_at: new Date(1610964588110),
      });
    });
});
