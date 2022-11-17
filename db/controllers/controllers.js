const {
  fetchCategories,
  fetchReviews,
  insertCommentByReviewId,
  fetchReviewsById,
  fetchCommentsByReviewId,
  updateVotes,
  fetchUsers,
} = require("../models/models.js");

exports.getCategories = (req, res, next) => {
  fetchCategories()
    .then((categories) => res.status(200).send({ categories }))
    .catch((err) => next(err));
};

exports.getReviews = (req, res, next) => {
    const { category, sort_by, order } = req.query;
  fetchReviews(category, sort_by, order)
    .then((reviews) => res.status(200).send({ reviews }))
    .catch((err) => next(err));
};

exports.getReviewsById = (req, res, next) => {
  const { review_id } = req.params;
  fetchReviewsById(review_id)
    .then((review) => res.status(200).send({ review }))
    .catch((err) => next(err));
};

exports.getCommentsByReviewId = (req, res, next) => {
  const { review_id } = req.params;
  fetchCommentsByReviewId(review_id)
    .then((comments) => {
      res.send({ comments });
    })
    .catch((err) => {
      next(err);
    });
};

exports.postCommentByReviewId = (req, res, next) => {
  const { review_id } = req.params;
  const newComment = req.body;
  insertCommentByReviewId(review_id, newComment)
    .then((comment) => res.status(201).send({ comment }))
    .catch((err) => {
      next(err);
    });
};

exports.patchVotes = (req, res, next) => {
  const { review_id } = req.params;
  const { inc_votes } = req.body;
  updateVotes(review_id, inc_votes)
    .then((review) => {
      res.status(202).send({ review });
    })
    .catch((err) => {
      next(err);
    });
};

exports.getUsers = (req, res, next) => {
  fetchUsers()
    .then((users) => res.status(200).send({ users }))
    .catch((err) => next(err));
};
