output "aws_dynamodb_table_users_name" {
  value = aws_dynamodb_table.users.name
}

output "aws_iam_policy_users_access_arn" {
  value = aws_iam_policy.dynamodb_users_access.arn
}

/*  */

output "aws_dynamodb_table_posts_name" {
  value = aws_dynamodb_table.posts.name
}

output "aws_iam_policy_posts_access_arn" {
  value = aws_iam_policy.dynamodb_posts_access.arn
}

/*  */

output "aws_dynamodb_table_global_posts_name" {
  value = aws_dynamodb_table.global_posts.name
}

output "aws_iam_policy_global_posts_access_arn" {
  value = aws_iam_policy.dynamodb_global_posts_access.arn
}

/*  */

output "aws_dynamodb_table_comments_name" {
  value = aws_dynamodb_table.comments.name
}

output "aws_iam_policy_comments_arn" {
  value = aws_iam_policy.dynamodb_comments_access.arn
}