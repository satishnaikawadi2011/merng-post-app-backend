const Post = require('../../models/Post');
const checkAuth = require('../../utils/check-auth');
const { AuthenticationError, UserInputError } = require('apollo-server');

module.exports = {
	Query    : {
		async getPosts() {
			try {
				const posts = await Post.find().sort({ createdAt: -1 });
				return posts;
			} catch (err) {
				throw new Error(err);
			}
		},
		async getPost(_, { postId }) {
			try {
				const post = await Post.findById(postId);
				if (post) {
					return post;
				}
				else {
					throw new Error('Post not found');
				}
			} catch (err) {
				throw new Error(err);
			}
		}
	},
	Mutation : {
		async createPost(_, { body }, context) {
			const user = checkAuth(context);
			// console.log(user);
			const errors = {};
			if (body.trim() === '') {
				errors.body = 'Post body must not be empty ';
				throw new UserInputError('Post body must not be empty', { errors });
			}
			const newPost = new Post({
				body,
				user      : user.id,
				username  : user.username,
				createdAt : new Date().toISOString()
			});

			const post = await newPost.save();
			return post;
		},
		async deletePost(_, { postId }, context) {
			const user = checkAuth(context);

			try {
				const post = await Post.findById(postId);
				if (user.username === post.username) {
					await post.deleteOne();
					return 'Post deleted successfully !';
				}
				else {
					throw new AuthenticationError('Action not allowed !');
				}
			} catch (err) {
				throw new Error(err);
			}
		},
		async likePost(_, { postId }, context) {
			const { username } = checkAuth(context);
			const post = await Post.findById(postId);
			if (post) {
				if (post.likes.find((like) => like.username === username)) {
					// post already liked , unlike it
					post.likes = post.likes.filter((like) => like.username !== username);
				}
				else {
					// like the post
					post.likes.push({
						createdAt : new Date().toISOString(),
						username
					});
				}
				await post.save();
				return post;
			}
			else throw new UserInputError('Post not found!');
		}
	}
};
