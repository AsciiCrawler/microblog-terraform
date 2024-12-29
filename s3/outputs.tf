output "aws_s3_lambda_bucket_id" {
  value = aws_s3_bucket.default.id
}

output "bucket_name" {
  value = local.bucket_name
}

output "bucket_arn" {
  value = aws_s3_bucket.default.arn
}

output "policy_arn" {
  value = aws_iam_policy.default.arn
}

output "regional_domain_name" {
  value = aws_s3_bucket.default.bucket_regional_domain_name
}
